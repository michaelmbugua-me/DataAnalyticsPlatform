import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FilterManagerComponent} from './FilterManagerComponent';

describe('FilterManagerComponent', () => {

  let component: FilterManagerComponent;
  let fixture: ComponentFixture<FilterManagerComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [FilterManagerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterManagerComponent);
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
