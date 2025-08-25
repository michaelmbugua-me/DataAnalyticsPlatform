import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FilterDrawerComponent} from './FilterDrawerComponent';

describe('FilterDrawerComponent', () => {

  let component: FilterDrawerComponent;
  let fixture: ComponentFixture<FilterDrawerComponent>;

  beforeEach(async () => {

    await TestBed.configureTestingModule({
      declarations: [], imports: [FilterDrawerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(FilterDrawerComponent);
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
