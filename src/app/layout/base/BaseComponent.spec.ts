import {ComponentFixture, TestBed} from '@angular/core/testing';
import {BaseComponent} from './BaseComponent';

describe('BaseComponent', () => {

  let component: BaseComponent;
  let fixture: ComponentFixture<BaseComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [BaseComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(BaseComponent);
    component = fixture.componentInstance;

  });

  afterEach(() => {
    jest.clearAllMocks();
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
